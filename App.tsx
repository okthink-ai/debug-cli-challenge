import { memo, Profiler, useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Provider, shallowEqual } from 'react-redux';
import {
  actions,
  addTodo,
  initialize,
  refresh,
  store,
  toggleTodo,
  useAppDispatch,
  useAppSelector,
} from './src/store';
import { setRenderFlash, useRenderFlash } from './src/render-flash';
import { activity } from './src/fixtures/activity';
import { onRender } from './src/performance';
import { installDebugBridge } from './src/debug';
import type { Todo } from './src/types';

installDebugBridge();

function activitySummary(id: string) {
  const recent = activity
    .filter((item) => item.todo === id)
    .sort((a, b) => b.time - a.time)
    .slice(0, 24);
  return recent.reduce((total, item) => total + item.weight, 0);
}
function TodoRow({ todo, onToggle }: { todo: Todo; onToggle: (id: string) => void }) {
  const highlightRenders = useRenderFlash();
  const flash = useRef(new Animated.Value(0)).current;
  const activityScore = activitySummary(todo.id);
  useEffect(() => {
    if (!highlightRenders) {
      flash.stopAnimation();
      flash.setValue(0);
    }
  }, [highlightRenders, flash]);
  useEffect(() => {
    if (!highlightRenders) return;
    flash.stopAnimation();
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 650, useNativeDriver: false }).start();
  });
  return (
    <Profiler id={`todo:${todo.id}`} onRender={onRender}>
      <Animated.View
        testID={`row-${todo.id}`}
        style={[
          styles.row,
          {
            borderColor: flash.interpolate({
              inputRange: [0, 1],
              outputRange: ['#e9e8e4', '#f07845'],
            }),
          },
        ]}
      >
        <Pressable
          testID={`toggle-${todo.id}`}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: todo.completed }}
          aria-checked={todo.completed}
          accessibilityLabel={`Complete ${todo.title}`}
          onPress={() => onToggle(todo.id)}
          style={[styles.checkbox, todo.completed && styles.checked]}
        >
          <Text style={styles.checkmark}>{todo.completed ? '✓' : ''}</Text>
        </Pressable>
        <View style={styles.rowCopy}>
          <Text style={[styles.todoTitle, todo.completed && styles.done]} numberOfLines={2}>
            {todo.title}
          </Text>
          <Text style={styles.meta}>
            {todo.project} · {activityScore > 0 ? 'Recently active' : 'Just added'}
          </Text>
        </View>
        <Text style={[styles.priority, todo.priority === 'high' && styles.high]}>
          {todo.priority === 'high' ? 'High' : 'Normal'}
        </Text>
      </Animated.View>
    </Profiler>
  );
}
const MemoTodoRow = memo(TodoRow);
function TodoList({ todos }: { todos: Todo[] }) {
  return (
    <View style={styles.list}>
      {todos.map((todo) => (
        <MemoTodoRow
          key={todo.id}
          todo={{ ...todo }}
          onToggle={(id) => {
            void toggleTodo(id);
          }}
        />
      ))}
    </View>
  );
}

function TodoScreen() {
  const dispatch = useAppDispatch();
  const highlightRenders = useRenderFlash();
  const state = useAppSelector(
    ({ config, todos, draft, loading, pending, notice, error }) => ({
      config,
      todos,
      draft,
      loading,
      pending,
      notice,
      error,
    }),
    shallowEqual,
  );
  useEffect(() => {
    void initialize();
  }, []);
  const completed = state.todos.filter((todo) => todo.completed).length;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topbar}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandGlyph}>✓</Text>
          </View>
          <Text style={styles.brandText}>little list</Text>
        </View>
        <View style={styles.identity}>
          <Text style={styles.platform}>{Platform.OS === 'ios' ? 'iOS' : 'WEB'}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.title}>Your tasks.</Text>
          <Text style={styles.subtitle}>Add a task, complete it, and see what persists.</Text>
        </View>
        <View style={styles.board}>
          <View style={styles.boardHeading}>
            <View style={styles.inline}>
              <Text style={styles.boardTitle}>Remaining</Text>
              <View style={styles.count}>
                <Text style={styles.countText}>{state.todos.length - completed}</Text>
              </View>
            </View>
            <Pressable
              testID="refresh"
              accessibilityRole="button"
              accessibilityLabel="Refresh tasks"
              onPress={() => {
                void refresh();
              }}
            >
              <Text style={styles.refresh}>↻ Refresh</Text>
            </Pressable>
          </View>
          <View style={styles.composer}>
            <TextInput
              testID="draft"
              accessibilityLabel="New task"
              placeholder="What needs doing?"
              placeholderTextColor="#96968e"
              value={state.draft}
              onChangeText={(text) => dispatch(actions.draft(text))}
              onSubmitEditing={() => {
                void addTodo();
              }}
              style={[styles.input, Platform.OS === 'web' ? { outlineWidth: 0 } : null]}
              maxLength={200}
              returnKeyType="done"
            />
            <View style={styles.composerFooter}>
              <Text style={styles.selectedPriority}>↑ High priority</Text>
              <Pressable
                testID="add"
                accessibilityRole="button"
                accessibilityLabel="Add task"
                disabled={state.pending || !state.draft.trim()}
                onPress={() => {
                  void addTodo();
                }}
                style={[styles.add, (state.pending || !state.draft.trim()) && styles.disabled]}
              >
                <Text style={styles.addText}>{state.pending ? 'Saving…' : '+  Add task'}</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.status}>
            <Text
              testID="status"
              accessibilityLiveRegion="polite"
              style={[styles.statusText, state.error ? styles.error : null]}
            >
              {state.error ||
                state.notice ||
                (state.loading ? 'Connecting to your list…' : `${completed} completed`)}
            </Text>
          </View>
          <TodoList todos={state.todos} />
        </View>
        <Text style={styles.footer}>A local demo for Give Your Agents Perception / okthink</Text>
      </ScrollView>
      <View style={styles.lab}>
        <View style={styles.inline}>
          <Switch
            testID="render-flash"
            accessibilityLabel="Highlight renders"
            value={highlightRenders}
            onValueChange={(value) => {
              setRenderFlash(value);
            }}
            trackColor={{ false: '#b7beb5', true: '#638067' }}
          />
          <Text style={styles.labText}>Highlight renders: {highlightRenders ? 'on' : 'off'}</Text>
        </View>
        <Text style={styles.labNote}>Orange outlines mark React commits</Text>
      </View>
    </SafeAreaView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <Provider store={store}>
        <Profiler id="TodoScreen" onRender={onRender}>
          <TodoScreen />
        </Profiler>
      </Provider>
    </SafeAreaProvider>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fafaf7' },
  topbar: {
    paddingHorizontal: 28,
    height: 78,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e7e7e0',
    backgroundColor: '#ffffff',
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 29,
    height: 29,
    backgroundColor: '#ed7040',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandGlyph: { fontSize: 21, fontWeight: '700', color: '#fff' },
  brandText: { color: '#202721', fontSize: 22, fontWeight: '700', letterSpacing: -0.7 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  platform: { color: '#8a8b82', fontSize: 11, fontWeight: '700', letterSpacing: 2 },
  content: { alignItems: 'center', paddingHorizontal: 22, paddingBottom: 50 },
  heading: { width: '100%', maxWidth: 760, paddingTop: 24, paddingBottom: 22, gap: 12 },
  title: {
    fontSize: Platform.OS === 'web' ? 38 : 28,
    letterSpacing: -1.7,
    fontWeight: '700',
    color: '#24312b',
  },
  subtitle: { color: '#596151', fontSize: 15, lineHeight: 22 },
  board: { width: '100%', maxWidth: 760 },
  boardHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 19,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  boardTitle: { fontSize: 20, fontWeight: '600', color: '#29342e' },
  count: { backgroundColor: '#eaece4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  countText: { color: '#76806d', fontSize: 12, fontWeight: '600' },
  refresh: { color: '#4e5b49', fontSize: 15 },
  composer: {
    borderWidth: 1,
    borderColor: '#d9dccf',
    borderRadius: 12,
    backgroundColor: '#fff',
    padding: 16,
    gap: 12,
  },
  input: { fontSize: 17, color: '#26362b', minHeight: 33 },
  composerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  selectedPriority: {
    fontSize: 12,
    color: '#ba754c',
    backgroundColor: '#fcf1e9',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
  },
  add: { paddingHorizontal: 17, paddingVertical: 11, backgroundColor: '#2f513d', borderRadius: 8 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.5 },
  status: { minHeight: 54, justifyContent: 'center' },
  statusText: { fontSize: 16, lineHeight: 23, fontWeight: '500', color: '#40533c' },
  error: { color: '#b53c32' },
  list: { gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    gap: 13,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: '#fff',
    minHeight: 79,
  },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#d5dacf',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: '#638067', borderColor: '#638067' },
  checkmark: { color: '#fff', fontWeight: '700', fontSize: 14 },
  rowCopy: { flex: 1, gap: 7 },
  todoTitle: { fontSize: 16, fontWeight: '500', color: '#384238', lineHeight: 23 },
  done: { textDecorationLine: 'line-through', color: '#979e91' },
  meta: { fontSize: 12, color: '#616b59' },
  priority: { fontSize: 12, color: '#616b59' },
  high: { color: '#bd7853' },
  footer: { fontSize: 10, color: '#a4a89d', paddingTop: 32 },
  lab: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e3e5db',
    backgroundColor: '#f2f3ec',
    flexWrap: 'wrap',
  },
  labText: { fontSize: 13, fontWeight: '600', color: '#44513e' },
  labNote: { fontSize: 12, color: '#58624f' },
});
